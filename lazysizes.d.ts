// lazysizes.d.ts
interface LazySizesConfig {
    expand?: number;
    expFactor?: number;
    loadMode?: number;
    lazyClass?: string;
    loadingClass?: string;
    loadedClass?: string;
    preloadClass?: string;
    errorClass?: string;
    autosizesClass?: string;
    srcAttr?: string;
    srcsetAttr?: string;
    sizesAttr?: string;
    [key: string]: any;
  }
  
  interface Window {
    lazySizesConfig: LazySizesConfig;
  }
  