import ClientError from "./ClientError.js";

class InvariantError extends ClientError {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}
export default InvariantError;