const Imap = require('imap');
const { simpleParser } = require('mailparser');

/**
 * Build an IMAP config object for a user row.
 */
function imapConfig(user) {
  return {
    user: user.mail_username || user.email,
    password: user.mail_password,
    host: user.imap_host || process.env.DEFAULT_IMAP_HOST,
    port: user.imap_port || parseInt(process.env.DEFAULT_IMAP_PORT, 10) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 10000,
    authTimeout: 10000,
  };
}

/**
 * Fetch inbox messages. Returns an array of parsed email objects.
 * @param {object} user – user DB row
 * @param {number} limit – how many recent messages
 */
function fetchInbox(user, limit = 30) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig(user));
    const messages = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { imap.end(); return reject(err); }

        const total = box.messages.total;
        if (total === 0) { imap.end(); return resolve([]); }

        const start = Math.max(1, total - limit + 1);
        const fetchRange = `${start}:${total}`;

        const f = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg, seqno) => {
          let uid = null;
          msg.on('attributes', (attrs) => { uid = attrs.uid; });
          msg.on('body', (stream) => {
            let buffer = '';
            stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
            stream.on('end', () => {
              simpleParser(buffer)
                .then((parsed) => {
                  messages.push({
                    uid: uid || seqno,
                    seqno,
                    subject: parsed.subject || '(no subject)',
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    date: parsed.date || null,
                    preview: (parsed.text || '').substring(0, 200),
                    html: parsed.html || null,
                    text: parsed.text || '',
                    attachments: (parsed.attachments || []).map((a) => ({
                      filename: a.filename,
                      contentType: a.contentType,
                      size: a.size,
                    })),
                  });
                })
                .catch(() => {}); // skip unparseable messages
            });
          });
        });

        f.once('error', (fetchErr) => { imap.end(); reject(fetchErr); });
        f.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', reject);
    imap.once('end', () => {
      // Sort newest first
      messages.sort((a, b) => new Date(b.date) - new Date(a.date));
      resolve(messages);
    });

    imap.connect();
  });
}

/**
 * Fetch a single email by UID.
 */
function fetchEmail(user, uid) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig(user));

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err) => {
        if (err) { imap.end(); return reject(err); }

        const f = imap.fetch(uid, { bodies: '', struct: true });
        let found = false;

        f.on('message', (msg) => {
          found = true;
          msg.on('body', (stream) => {
            let buffer = '';
            stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
            stream.on('end', () => {
              simpleParser(buffer)
                .then((parsed) => {
                  resolve({
                    uid,
                    subject: parsed.subject || '(no subject)',
                    from: parsed.from?.text || '',
                    to: parsed.to?.text || '',
                    cc: parsed.cc?.text || '',
                    date: parsed.date || null,
                    html: parsed.html || null,
                    text: parsed.text || '',
                    attachments: (parsed.attachments || []).map((a) => ({
                      filename: a.filename,
                      contentType: a.contentType,
                      size: a.size,
                    })),
                  });
                })
                .catch(reject);
            });
          });
        });

        f.once('error', (fetchErr) => { imap.end(); reject(fetchErr); });
        f.once('end', () => {
          imap.end();
          if (!found) reject(new Error('Message not found'));
        });
      });
    });

    imap.once('error', reject);
    imap.connect();
  });
}

module.exports = { fetchInbox, fetchEmail };
