import { Button, Paper, Text, Title, useMantineTheme } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";

const CancelPage = () => {
  const theme = useMantineTheme();

  const location = useLocation();
  // Example of accessing query parameters
  const queryParams = new URLSearchParams(location.search);
  const canceled = queryParams.get("canceled"); // 'true' if exists

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.gray[0],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        withBorder
        shadow="md"
        p="xl"
        style={{ textAlign: "center", backgroundColor: theme.colors.gray[0] }}
      >
        <Title order={1} style={{ color: theme.colors.tan[0] }}>
          Payment Canceled
        </Title>
        {canceled === "true" && (
          <Text
            size="lg"
            style={{
              marginTop: "1rem",
              marginBottom: "1rem",
              color: theme.colors.tan[0],
            }}
          >
            Your payment process was canceled.
          </Text>
        )}
        <Button
          variant="outline"
          color={theme.colors.sage[0]}
          size="md"
          component={Link}
          to="/gallery"
        >
          Back to Gallery
        </Button>
      </Paper>
    </div>
  );
};

export default CancelPage;
