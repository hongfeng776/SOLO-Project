import svgCaptcha from 'svg-captcha';
import { CaptchaResult } from '../types';

interface CaptchaOptions {
  size?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  noise?: number;
  color?: boolean;
  background?: string;
  ignoreChars?: string;
}

export function generateCaptcha(options: CaptchaOptions = {}): CaptchaResult {
  const defaultOptions: CaptchaOptions = {
    size: 4,
    width: 120,
    height: 40,
    fontSize: 36,
    noise: 3,
    color: true,
    background: '#f0f0f0',
    ignoreChars: '0o1il',
  };

  const captcha = svgCaptcha.create({ ...defaultOptions, ...options });

  return {
    text: captcha.text,
    data: captcha.data,
  };
}

export function generateMathCaptcha(options: CaptchaOptions = {}): CaptchaResult {
  const defaultOptions: CaptchaOptions = {
    width: 120,
    height: 40,
    fontSize: 36,
    noise: 3,
    color: true,
    background: '#f0f0f0',
  };

  const captcha = svgCaptcha.createMathExpr({ ...defaultOptions, ...options });

  return {
    text: captcha.text,
    data: captcha.data,
  };
}
