// Type definitions for Node.js
// These are minimal type definitions for Node.js globals

interface ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  [key: string]: string | undefined;
}

declare var process: {
  env: ProcessEnv;
  [key: string]: any;
};

declare var __DEV__: boolean;

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
