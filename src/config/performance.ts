/**
 * Performance configuration for NanoSocket
 */
export const PerformanceConfig = {
  DEFAULT_MAX_BACKPRESSURE: 64 * 1024,
  DEFAULT_MAX_COMPRESSED_SIZE: 64 * 1024,
  DEFAULT_IDLE_TIMEOUT: 120,
  DEFAULT_MAX_PAYLOAD_LENGTH: 16 * 1024 * 1024,
  
  COMPRESSION_SETTINGS: {
    SHARED_COMPRESSOR: 0,
    DEDICATED_COMPRESSOR: 1,
    DEDICATED_COMPRESSOR_3KB: 2,
    DEDICATED_COMPRESSOR_4KB: 3,
    DEDICATED_COMPRESSOR_8KB: 4,
    DEDICATED_COMPRESSOR_16KB: 5,
    DEDICATED_COMPRESSOR_32KB: 6,
    DEDICATED_COMPRESSOR_64KB: 7,
    DEDICATED_COMPRESSOR_128KB: 8,
    DEDICATED_COMPRESSOR_256KB: 9
  },
  
  SEND_STATUS: {
    BACKPRESSURE: 1,
    SUCCESS: 2,
    DROPPED: 3
  }
};

/**
 * Optimized server options for high performance
 */
export const OptimizedServerOptions = {
  compression: PerformanceConfig.COMPRESSION_SETTINGS.DEDICATED_COMPRESSOR_16KB,
  maxBackpressure: PerformanceConfig.DEFAULT_MAX_BACKPRESSURE,
  maxCompressedSize: PerformanceConfig.DEFAULT_MAX_COMPRESSED_SIZE,
  idleTimeout: PerformanceConfig.DEFAULT_IDLE_TIMEOUT,
  maxPayloadLength: PerformanceConfig.DEFAULT_MAX_PAYLOAD_LENGTH
};