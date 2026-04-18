declare global {
  namespace Express {
    interface Request {
      authUser?: any;
    }
  }
}

export {};
