class BaseError extends Error {
   public errorCode: number;
   public statusCode: string;

   constructor(errorCode: number, statusCode: string, message: string) {
      super(message);
      this.errorCode = errorCode;
      this.statusCode = statusCode;

      Object.setPrototypeOf(this, BaseError.prototype);
   }
}

export default BaseError;
