import React from 'react';
import {Image, ImageProps, ImageURISource} from 'react-native';

// Signed URLs are stable on the server. Fresco keeps images in the app's own
// bounded memory/disk cache; no shared-storage permission is needed.
export function CachedImage({source, ...props}: ImageProps) {
  const cached = source && !Array.isArray(source) && typeof source === 'object' && 'uri' in source
    ? {...source, cache: 'force-cache' as ImageURISource['cache']}
    : source;
  return <Image {...props} source={cached} fadeDuration={0} />;
}
