import { useState } from 'react';
import { View } from 'react-native';
import { router, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Text } from './Text';
import { initials, useAuth } from '../lib/auth';
import { colors, space } from '../theme';

const roleLabel = { applicant: 'Applicant', student: 'Student', staff: 'Staff', admin: 'Admin' } as const;

type Link = { icon: keyof typeof Feather.glyphMap; label: string; href: Href };

// Shared by the applicant, student and staff profile screens.
export function ProfileView({ links }: { links: Link[] }) {
  const { profile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!profile) return null;

  return (
    <View style={{ gap: space.lg }}>
      <Card large style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <Avatar label={initials(profile)} size={64} />
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="h2">{profile.first_names} {profile.surname}</Text>
          <Chip label={roleLabel[profile.role]} tone="brand" />
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <Detail icon="mail" label="Email" value={profile.email} />
        {profile.phone ? <Detail icon="phone" label="Phone or WhatsApp" value={profile.phone} /> : null}
      </Card>

      <View style={{ gap: space.sm }}>
        {links.map((l) => (
          <Card key={l.label} onPress={() => router.push(l.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Feather name={l.icon} size={20} color={colors.brand} />
            <Text variant="bodySemi" style={{ flex: 1 }}>{l.label}</Text>
            <Feather name="chevron-right" size={20} color={colors.muted} />
          </Card>
        ))}
      </View>

      <Button
        title="Sign out"
        variant="danger"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await signOut();
        }}
      />
    </View>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
      <Feather name={icon} size={18} color={colors.muted} />
      <View style={{ flex: 1 }}>
        <Text variant="small">{label}</Text>
        <Text>{value}</Text>
      </View>
    </View>
  );
}
