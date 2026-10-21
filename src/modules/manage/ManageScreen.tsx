import React from 'react';
import { Pressable } from 'react-native';
import { openManage, ManageRoute } from '../../navigation/routes';
import { theme } from '../../theme';
import { Box, Card, Icon, Row, ScreenContainer, Stack, Typography } from '../../components';
import { Ionicons } from '@expo/vector-icons';

interface ManageItem {
  route: ManageRoute;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GROUPS: { title: string; items: ManageItem[] }[] = [
  {
    title: 'Production & stock',
    items: [
      {
        route: '/movements',
        title: 'Stock Movements',
        description: 'Every change to stock, with its source',
        icon: 'swap-vertical-outline',
      },
    ],
  },
  {
    title: 'Buying & selling',
    items: [
      {
        route: '/suppliers',
        title: 'Suppliers & Bills',
        description: 'Vendors and purchase bills',
        icon: 'business-outline',
      },
      {
        route: '/customers',
        title: 'Customers & Payments',
        description: 'Who owes what, collections',
        icon: 'people-outline',
      },
      {
        route: '/expenses',
        title: 'Expenses',
        description: 'Wages, power, fuel and other costs',
        icon: 'wallet-outline',
      },
      {
        route: '/ledger',
        title: 'Financial Ledger',
        description: 'Money in and out, by date',
        icon: 'book-outline',
      },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        route: '/settings',
        title: 'Profile & Settings',
        description: 'Business name, currency, units, backup',
        icon: 'settings-outline',
      },
    ],
  },
];

/** Everything that is not a daily task lives here, one tap from the gear icon. */
export const ManageScreen: React.FC = () => (
  <ScreenContainer>
    <Stack gap="lg">
      {GROUPS.map((group) => (
        <Stack key={group.title} gap="sm">
          <Typography variant="label" color="muted">
            {group.title}
          </Typography>
          <Card variant="elevated" padding="none">
            {group.items.map((item, index) => (
              <Pressable
                key={item.route}
                onPress={() => openManage(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <Row
                  gap="md"
                  align="center"
                  style={{
                    padding: theme.spacing.base,
                    ...(index > 0
                      ? { borderTopWidth: 1, borderTopColor: 'rgba(128,128,150,0.18)' }
                      : {}),
                  }}
                >
                  <Icon name={item.icon} size="lg" color="brandPrimary" />
                  <Box flex={1}>
                    <Typography variant="title" color="primary">
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {item.description}
                    </Typography>
                  </Box>
                  <Icon name="chevron-forward" size="md" color="subtle" />
                </Row>
              </Pressable>
            ))}
          </Card>
        </Stack>
      ))}
    </Stack>
  </ScreenContainer>
);

export default ManageScreen;
