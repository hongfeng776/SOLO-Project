declare module 'svg-captcha' {
  interface ConfigObject {
    size?: number;
    ignoreChars?: string;
    noise?: number;
    color?: boolean;
    background?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    charPreset?: string;
  }

  interface CaptchaObj {
    data: string;
    text: string;
  }

  function create(options?: ConfigObject): CaptchaObj;
  function createMathExpr(options?: ConfigObject): CaptchaObj;

  export = {
    create,
    createMathExpr,
  };
}
