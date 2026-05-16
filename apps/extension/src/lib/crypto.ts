const ENCRYPTION_KEY_NAME = 'pagebrief_device_key';

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get(ENCRYPTION_KEY_NAME);
  const existing = stored[ENCRYPTION_KEY_NAME] as string | undefined;
  if (existing) {
    const raw = base64ToBytes(existing);
    return crypto.subtle.importKey(
      'raw',
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const rawKey = await crypto.subtle.exportKey('raw', key);
  await chrome.storage.local.set({ [ENCRYPTION_KEY_NAME]: bytesToBase64(new Uint8Array(rawKey)) });
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptString(
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptString(ciphertext: string, iv: string): Promise<string> {
  const key = await getOrCreateDeviceKey();
  const ivBytes = base64ToBytes(iv);
  const cipherBytes = base64ToBytes(ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes.buffer.slice(
        ivBytes.byteOffset,
        ivBytes.byteOffset + ivBytes.byteLength,
      ) as ArrayBuffer,
    },
    key,
    cipherBytes.buffer.slice(
      cipherBytes.byteOffset,
      cipherBytes.byteOffset + cipherBytes.byteLength,
    ) as ArrayBuffer,
  );
  return new TextDecoder().decode(decrypted);
}

export async function hashString(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return bytesToBase64(new Uint8Array(buf));
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
