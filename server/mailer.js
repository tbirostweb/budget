// Envoi du code de connexion par email.
// Si aucun SMTP n'est configuré, le code est affiché dans les logs (mode dev).
import nodemailer from 'nodemailer'

const HOST = process.env.SMTP_HOST
const PORT = Number(process.env.SMTP_PORT || 587)
const USER = process.env.SMTP_USER
const PASS = process.env.SMTP_PASS
const FROM = process.env.SMTP_FROM || 'Budget <no-reply@localhost>'

const configured = Boolean(HOST && USER && PASS)

let transport = null
if (configured) {
  transport = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: { user: USER, pass: PASS }
  })
}

export async function sendLoginCode(email, code) {
  if (!configured) {
    console.log('\n==============================')
    console.log(`  CODE DE CONNEXION pour ${email} : ${code}`)
    console.log('  (SMTP non configuré — mode dev)')
    console.log('==============================\n')
    return
  }
  await transport.sendMail({
    from: FROM,
    to: email,
    subject: `Ton code de connexion : ${code}`,
    text: `Voici ton code de connexion : ${code}\nIl expire dans 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto">
        <h2>Ton code de connexion</h2>
        <p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>
        <p style="color:#666">Il expire dans 10 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
      </div>`
  })
}

export const smtpConfigured = configured
