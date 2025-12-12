import { useMantineTheme, Paper, Title, Text, Button } from "@mantine/core";
import { Link } from 'react-router-dom';

const SuccessPage = () => {
    const theme = useMantineTheme();


    return (
        <div style={{ 
            minHeight: '100vh',
            backgroundColor: theme.colors.gray[0],
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
        }}>
            <Paper 
                withBorder 
                shadow="md" 
                p="xl" 
                style={{ textAlign: 'center',backgroundColor: theme.colors.gray[0] }}
            >
                <Title order={1} style={{ color: theme.colors.tan[0] }}>Payment Successful</Title>
                <Text 
                    size="lg" 
                    style={{ 
                        marginTop: '1rem', 
                        marginBottom: '1rem',
                        color: theme.colors.tan[0]
                    }}
                >
                    Thank you for your payment! A confirmation email has been sent to you.
                </Text>
            
                <Button 
                    variant="outline" 
                    color={theme.colors.sage[0]}
                    size="md" 
                    component={Link} 
                    to="/"
                >
                    Return to Home
                </Button>
            </Paper>
        </div>
    );
};

export default SuccessPage;
