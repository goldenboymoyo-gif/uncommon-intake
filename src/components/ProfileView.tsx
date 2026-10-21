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
import { pickAndUploadAvatar } from '../lib/avatar';
import { colors, space } from '../theme';

const roleLabel = { applicant: 'Applicant', student: 'Student', staff: 'Staff', admin: 'Admin' } as const;

type Link = { icon: keyof typeof Feather.glyphMap; label: string; href: Href };

// Shared by the applicant, student and staff profile screens.
export function ProfileView({ links }: { links: Link[] }) {
  const { profile, signOut, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  if (!profile) return null;

  return (
    <View style={{ gap: space.lg }}>
      <Card large style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <Avatar label={initials(profile)} path={profile.avatar_path} size={64} />
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="h2">{profile.first_names} {profile.surname}</Text>
          <Chip label={roleLabel[profile.role]} tone="brand" />
        </View>
      </Card>
      <Button
        title={profile.avatar_path ? 'Change profile photo' : 'Add a profile photo'}
        variant="outline"
        icon="camera"
        loading={photoBusy}
        onPress={async () => {
          setPhotoBusy(true);
          setPhotoError(null);
          try {
            if (await pickAndUploadAvatar(profile.id)) await refreshProfile();
          } catch (e) {
            setPhotoError((e as Error).message);
          } finally {
            setPhotoBusy(false);
          }
        }}
      />
      {photoError ? <Text variant="small" style={{ color: colors.danger }}>{photoError}</Text> : null}

      <Card style={{ gap: space.md }}>
        <Detail icon="mail" label="Email" value={profile.email} />
        {profile.phone ? <Detail icon="phone" label="Phone or WhatsApp" value={profile.phone} /> : null}
      </Card>

      <View style={{ gap: space.sm }}>
        {links.map((l) => (
          <Card key={l.label} onPress={() => router.push(l.href)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Feather name={l.icon} size={20} color={colors.brand} />
            <Text variant="bodySemi" style={{ flex: 1 }}>{l.label}</Text>
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
