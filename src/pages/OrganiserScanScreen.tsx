import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, XCircle, Keyboard, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Result = { ok: true; name?: string; photo?: string; event_name?: string } | { ok: false; reason: string };

export default function OrganiserScanScreen() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const verify = async (token: string) => {
    const t = token.trim();
    if (!t) return;
    setBusy(true);
    try {
      const { data, error } = await (supabase.rpc as any)('verify_ticket_qr', { p_qr: t });
      if (error) throw error;
      setResult(data as Result);
    } catch (e: any) {
      setResult({ ok: false, reason: e.message || 'error' });
    } finally {
      setBusy(false);
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    setResult(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          verify(decoded);
        },
        () => {}
      );
      setScanning(true);
    } catch (e: any) {
      setCameraError(e?.message || 'Camera unavailable. Use manual entry below.');
    }
  };

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold tracking-tight">Scan Tickets</h1>
      </header>

      <div className="p-4 space-y-4">
        {!scanning && !result && (
          <Button className="w-full h-12" onClick={startScanner}>
            <Camera className="w-4 h-4 mr-2" /> Start Camera Scanner
          </Button>
        )}

        <div id="qr-reader" className="rounded-2xl overflow-hidden bg-black" style={{ minHeight: scanning ? 300 : 0 }} />

        {cameraError && (
          <p className="text-sm text-destructive text-center">{cameraError}</p>
        )}

        <div className="pt-2 border-t border-border">
          <label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-2">
            <Keyboard className="w-3 h-3" /> Manual token entry
          </label>
          <div className="flex gap-2">
            <Input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Paste QR token" />
            <Button disabled={busy || !manualToken.trim()} onClick={() => verify(manualToken)}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        </div>

        {result && (
          <div className={`mt-4 rounded-2xl p-6 text-center ${result.ok ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
            {result.ok ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                {result.photo && <img src={result.photo} alt="" className="w-20 h-20 rounded-full mx-auto mb-2 object-cover" onError={(e) => (e.currentTarget.src = '/default-avatar.png')} />}
                <p className="font-bold text-lg">{result.name || 'Attendee'}</p>
                <p className="text-sm text-muted-foreground">Checked in to {result.event_name}</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                <p className="font-bold text-lg">Invalid ticket</p>
                <p className="text-sm text-muted-foreground">{result.reason === 'already_used' ? 'Ticket has already been used.' : 'Ticket not found.'}</p>
              </>
            )}
            <Button variant="outline" className="mt-4" onClick={() => { setResult(null); startScanner(); }}>Scan another</Button>
          </div>
        )}
      </div>
    </div>
  );
}
