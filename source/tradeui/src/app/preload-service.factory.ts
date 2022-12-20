import { ConfigLoaderService } from "src/services/config-loader.service";

export function PreloadFactory(configService: ConfigLoaderService) {
  return () => configService.initialize();
}
