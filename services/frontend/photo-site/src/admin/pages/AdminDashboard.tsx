import {
  Title,
  Card,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  useMantineTheme,
  Box,
  Drawer,
  Divider,
  Grid,
} from "@mantine/core";
import { useState } from "react";
import { IconChartBar, IconLogout } from "@tabler/icons-react";
import { LocationPin } from "../../types/LocationPin";
import AdminMap from "../components/AdminMap";

interface AdminDashboardProps {
  pins: LocationPin[];
  onEditPin: (pin: LocationPin) => void;
  onCreatePin: (coordinates?: { latitude: number; longitude: number }) => void;
  onDeletePin: (pinId: string) => void;
  onLogout?: () => void;
}

const AdminDashboard = ({
  pins,
  onEditPin,
  onCreatePin,
  onDeletePin,
  onLogout,
}: AdminDashboardProps) => {
  const theme = useMantineTheme();
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);

  return (
    <Box
      style={{
        height: "100vh",
        backgroundColor: theme.colors.brown[9],
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        style={{
          backgroundColor: theme.colors.darkGreen[8],
          borderBottom: `1px solid ${theme.colors.sage[6]}`,
          padding: theme.spacing.md,
        }}
      >
        <Group justify="space-between" align="center">
          <Title order={2} c={theme.colors.white[0]}>
            Photography Admin Dashboard
          </Title>

          <Group gap="md">
            <Button
              variant="light"
              color={theme.colors.sage[4]}
              leftSection={<IconChartBar size={16} />}
              onClick={() => setStatsDrawerOpen(true)}
            >
              Statistics
            </Button>

            <Button
              bg={theme.colors.brown[6]}
              c={theme.colors.white[0]}
              onClick={() => onCreatePin()}
            >
              Add Location
            </Button>

            {onLogout && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={onLogout}
              >
                Logout
              </Button>
            )}
          </Group>
        </Group>
      </Box>

      {/* Map */}
      <Box style={{ height: "calc(100vh - 80px)" }}>
        <AdminMap
          pins={pins}
          onEditPin={onEditPin}
          onCreatePin={onCreatePin}
          onDeletePin={onDeletePin}
        />
      </Box>

      {/* Statistics Drawer */}
      <Drawer
        opened={statsDrawerOpen}
        onClose={() => setStatsDrawerOpen(false)}
        title="Dashboard Statistics"
        position="right"
        size="lg"
        styles={{
          content: { backgroundColor: theme.colors.brown[9] },
          header: {
            backgroundColor: theme.colors.brown[9],
            borderBottom: `1px solid ${theme.colors.sage[6]}`,
          },
          title: { color: theme.colors.white[0], fontWeight: 600 },
          body: {
            backgroundColor: theme.colors.brown[9],
            padding: theme.spacing.md,
          },
        }}
      >
        <Stack gap="md">
          {/* Core Statistics */}
          <Grid>
            <Grid.Col span={6}>
              <Card bg={theme.colors.darkGreen[8]} radius="md" p="md">
                <Text size="sm" c={theme.colors.sage[2]} fw={500}>
                  Total Locations
                </Text>
                <Text size="xl" c={theme.colors.white[0]} fw={700}>
                  {pins.length}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card bg={theme.colors.darkGreen[8]} radius="md" p="md">
                <Text size="sm" c={theme.colors.sage[2]} fw={500}>
                  Total Photos
                </Text>
                <Text size="xl" c={theme.colors.white[0]} fw={700}>
                  {pins.reduce((total, pin) => {
                    if (pin.trips) {
                      return (
                        total +
                        pin.trips.reduce(
                          (tripTotal, trip) => tripTotal + trip.photos.length,
                          0
                        )
                      );
                    }
                    return total + (pin.photos?.length || 0);
                  }, 0)}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card bg={theme.colors.darkGreen[8]} radius="md" p="md">
                <Text size="sm" c={theme.colors.sage[2]} fw={500}>
                  Featured Pins
                </Text>
                <Text size="xl" c={theme.colors.white[0]} fw={700}>
                  {pins.filter((pin) => pin.featured).length}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card bg={theme.colors.darkGreen[8]} radius="md" p="md">
                <Text size="sm" c={theme.colors.sage[2]} fw={500}>
                  Multi-Trip Locations
                </Text>
                <Text size="xl" c={theme.colors.brown[4]} fw={700}>
                  {
                    pins.filter((pin) => pin.trips && pin.trips.length > 0)
                      .length
                  }
                </Text>
              </Card>
            </Grid.Col>
          </Grid>

          <Divider color={theme.colors.sage[6]} />

          {/* Category Breakdown */}
          <Card bg={theme.colors.darkGreen[8]} radius="md" p="md">
            <Text fw={600} c={theme.colors.white[0]} mb="sm">
              Category Breakdown
            </Text>
            <Stack gap="xs">
              {Object.entries(
                pins.reduce((acc, pin) => {
                  acc[pin.category] = (acc[pin.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([category, count]) => (
                <Group key={category} justify="space-between">
                  <Text size="sm" c={theme.colors.sage[2]} tt="capitalize">
                    {category}
                  </Text>
                  <Badge
                    variant="light"
                    color={theme.colors.brown[4]}
                    size="sm"
                  >
                    {count}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Card>

          <Divider color={theme.colors.sage[6]} />

          {/* Trip Statistics */}
          <Card bg={theme.colors.darkGreen[8]} radius="md" p="md">
            <Text fw={600} c={theme.colors.white[0]} mb="sm">
              Trip Statistics
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c={theme.colors.sage[2]}>
                  Total Trips
                </Text>
                <Text size="sm" c={theme.colors.white[0]} fw={600}>
                  {pins.reduce(
                    (total, pin) => total + (pin.trips?.length || 1),
                    0
                  )}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c={theme.colors.sage[2]}>
                  Average Trips per Location
                </Text>
                <Text size="sm" c={theme.colors.white[0]} fw={600}>
                  {(
                    pins.reduce(
                      (total, pin) => total + (pin.trips?.length || 1),
                      0
                    ) / pins.length
                  ).toFixed(1)}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Drawer>
    </Box>
  );
};

export default AdminDashboard;
