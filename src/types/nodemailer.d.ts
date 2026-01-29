declare module "nodemailer" {
  type Transporter = {
    sendMail: (options: Record<string, unknown>) => Promise<unknown>;
  };
  type TransportOptions = Record<string, unknown>;
  function createTransport(options: TransportOptions): Transporter;
  export default { createTransport };
}
