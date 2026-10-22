import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { formatDate, useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import type { AppNotification } from '../../lib/types';
import { colors, space } from '../../theme';

const icons: Record<AppNotification['kind'], { name: keyof typeof Feather.glyphMap; color: string }> = {
  decision: { name: 'award', color: colors.accentOrange },
  reminder: { name: 'clock', color: colors.accentBlue },
  survey: { name: 'clipboard', color: colors.accentMint },
  general: { name: 'bell', color: colors.accentRose },
};

export default function Notifications() {
  const { profile } = useAuth();
  const { data, loading, reload } = useQuery(async () => {
    const { data: rows } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(50);
    return (rows ?? []) as AppNotification[];
  }, [profile?.id], `notifications:${profile?.id}`);

  // Opening the list marks everything as read.
  useEffect(() => {
    if (data?.some((n) => !n.read_at)) {
      supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', profile!.id).is('read_at', null).then(() => undefined);
    }
  }, [data]);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <Text variant="h1">Notifications</Text>
        {!loading && !data?.length ? (
          <EmptyState icon="bell" title="No notifications yet" body="Decisions and reminders will show here." />
        ) : (
          data?.map((n) => (
            <Card
              key={n.id}
              onPress={n.kind === 'decision' ? () => router.push('/status') : n.kind === 'survey' ? () => router.navigate('/surveys') : undefined}
              style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={icons[n.kind].name} size={18} color={icons[n.kind].color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
                  <Text variant="bodySemi" style={{ flex: 1 }}>{n.title}</Text>
                  {!n.read_at ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 8 }} /> : null}
                </View>
                <Text variant="small">{n.body}</Text>
                <Text variant="tiny">{formatDate(n.created_at)}</Text>
              </View>
            </Card>
          ))
        )}
      </Screen>
    </View>
  );
}
