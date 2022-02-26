import nodemailer from 'nodemailer'
class Mailer {
  constructor () {
    this.sioserver = null
    this.config = {}
    this.transporter = null
  }
  init (sioserver) {
    this.sioserver = sioserver
    this.config = sioserver.config.email
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port == 465,
      auth: {
        user: this.config.user,
        pass: this.config.password
      }
    })
  }
  async send (to, subject, data) {
    let send = await this.transporter.sendMail({
      from: `"${this.config.from}" <${this.config.user}>`,
      to,
      subject,
      html: data
    })
    return send
  }
}
export default Mailer
