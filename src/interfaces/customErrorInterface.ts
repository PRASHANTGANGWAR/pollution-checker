interface CustomError extends Error {
  statusCode?: number;
  details?: any;
  name: string;
}

export default CustomError;
