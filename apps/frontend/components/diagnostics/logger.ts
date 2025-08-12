let _buf: any[] = [];
const LIMIT = 500;

export function logDiag(event: string, meta?: any) {
  try {
    _buf.push({ t: new Date().toISOString(), event, meta });
    if (_buf.length > LIMIT) _buf.shift();
  } catch {}
}

export function dumpDiag() {
  return _buf.slice();
}

export function clearDiag() {
  _buf = [];
}



