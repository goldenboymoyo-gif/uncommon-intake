import { useState } from 'react';
import { colors, space } from '../theme';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

/** A delete button that asks once more before doing anything. */
export function ConfirmDelete({ label, warning, onConfirm }: { label: string; warning: string; onConfirm: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!asking) return <Button title={label} variant="danger" icon="trash-2" onPress={() => setAsking(true)} />;
  return (
    <Card style={{ gap: space.md, borderColor: colors.danger }}>
      <Text variant="bodySemi">{label}?</Text>
      <Text variant="small">{warning}</Text>
      <Button
        title="Yes, delete"
        variant="danger"
        haptic
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await onConfirm();
          } catch (e) {
            setError((e as Error).message || 'We could not delete this. Please try again.');
            setBusy(false);
          }
        }}
      />
      <Button title="Cancel" variant="ghost" onPress={() => setAsking(false)} />
      {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
    </Card>
  );
}
