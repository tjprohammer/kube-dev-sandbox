import { useState } from "react";
import {
  Container,
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  useMantineTheme,
} from "@mantine/core";
import { IconLock, IconAlertCircle } from "@tabler/icons-react";
import { CognitoAuthService } from "../../services/awsService";
import { TempAuthService } from "../../services/tempAuthService";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

const AdminAuth = ({ onAuthenticated }: AdminAuthProps) => {
  const theme = useMantineTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side username validation mirroring service logic
    const zeroWidthChars = ["\u200B", "\u200C", "\u200D", "\u2060", "\uFEFF"];
    let sanitized = username;
    zeroWidthChars.forEach((ch) => {
      sanitized = sanitized.split(ch).join("");
    });
    sanitized = sanitized.replace(/\s+/g, "");
    const hasControl = Array.from(sanitized).some((c) => c.charCodeAt(0) < 32);
    if (!sanitized || hasControl) {
      setLoading(false);
      setError("Username cannot contain spaces or control characters.");
      return;
    }

    try {
      // Try Cognito authentication first, fallback to temp auth
      let result;
      try {
        result = await CognitoAuthService.signIn(sanitized, password);
      } catch (cognitoError) {
        console.warn(
          "Cognito auth failed, using temporary auth:",
          cognitoError
        );
        result = await TempAuthService.signIn(sanitized, password);
      }

      if (result.success) {
        onAuthenticated();
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Auth error:", error);
      // Fallback to temp auth
      try {
        const tempResult = await TempAuthService.signIn(sanitized, password);
        if (tempResult.success) {
          onAuthenticated();
        } else {
          setError("Authentication failed. Please try again.");
        }
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      size="xs"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.brown[9],
      }}
    >
      <Paper
        shadow="md"
        p="xl"
        radius="md"
        style={{
          backgroundColor: theme.colors.darkGreen[8],
          border: `1px solid ${theme.colors.sage[6]}`,
          width: "100%",
        }}
      >
        <Stack gap="md" align="center">
          <IconLock size={48} color={theme.colors.brown[5]} />

          <Title order={2} ta="center" c={theme.colors.white[0]}>
            Admin Access
          </Title>

          <Text ta="center" c={theme.colors.sage[3]} size="sm">
            Enter your admin credentials to access the photography management
            dashboard.
          </Text>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Authentication Failed"
              color="red"
              variant="light"
              style={{ width: "100%" }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <Stack gap="md">
              <TextInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                styles={{
                  label: {
                    color: theme.colors.white[0],
                  },
                  input: {
                    backgroundColor: theme.colors.brown[8],
                    borderColor: theme.colors.sage[6],
                    color: theme.colors.white[0],
                    "&:focus": {
                      borderColor: theme.colors.brown[5],
                    },
                  },
                }}
                size="md"
              />

              <TextInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                styles={{
                  label: {
                    color: theme.colors.white[0],
                  },
                  input: {
                    backgroundColor: theme.colors.brown[8],
                    borderColor: theme.colors.sage[6],
                    color: theme.colors.white[0],
                    "&:focus": {
                      borderColor: theme.colors.brown[5],
                    },
                  },
                }}
                size="md"
              />

              <Button
                type="submit"
                loading={loading}
                bg={theme.colors.brown[6]}
                c={theme.colors.white[0]}
                size="md"
                fullWidth
                style={{
                  "&:hover": {
                    backgroundColor: theme.colors.brown[7],
                  },
                }}
              >
                Access Admin Dashboard
              </Button>
            </Stack>
          </form>

          <Text ta="center" c={theme.colors.sage[4]} size="xs">
            Photography Portfolio Admin Interface
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
};

export default AdminAuth;
