import React, { FormEvent, useState, useEffect } from "react";
import {
  Textarea,
  Button,
  Container,
  Title,
  Box,
  useMantineTheme,
  MantineTheme,
  SelectStylesNames,
  CSSProperties,
  Image,
  TextInput,
  Select,
} from "@mantine/core";
import logo from "../assets/logo-svg.svg";
import { showNotification } from "@mantine/notifications";
import { AWS_CONFIG, ENV_CONFIG } from "../config/aws-config";
import { useSearchParams } from "react-router-dom";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const theme = useMantineTheme();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [emailError, setEmailError] = useState<string>("");

  // Pre-fill form from URL parameters
  useEffect(() => {
    const urlSubject = searchParams.get("subject");
    const urlMessage = searchParams.get("message");
    const photoTitle = searchParams.get("photo");
    const material = searchParams.get("material");
    const size = searchParams.get("size");

    console.log("Contact form URL params:", {
      urlSubject,
      urlMessage,
      photoTitle,
      material,
      size,
    });

    // If we have direct subject/message from LocationViewer
    if (urlSubject || urlMessage) {
      console.log("Setting form data with subject/message");
      setFormData((prev) => ({
        ...prev,
        subject: urlSubject ? decodeURIComponent(urlSubject) : prev.subject,
        message: urlMessage ? decodeURIComponent(urlMessage) : prev.message,
      }));
    }
    // Otherwise, handle photo/material/size from Gallery (if we still use it)
    else if (photoTitle) {
      console.log("Setting form data with photo/material/size");
      let prefilledMessage = `I'm interested in "${photoTitle}"`;
      if (material) prefilledMessage += ` as ${material}`;
      if (size) prefilledMessage += ` in size ${size}`;
      prefilledMessage += ".\n\n";

      setFormData((prev) => ({
        ...prev,
        subject: "Product Inquiry",
        message: prefilledMessage,
      }));
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(
        `${ENV_CONFIG.apiBaseUrl}${AWS_CONFIG.apiGateway.endpoints.contact}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const text = await response.text(); // Get response as text first
      try {
        const data = JSON.parse(text);
        console.log("Success:", data);
        // Other logic to use 'data'
      } catch (error) {
        console.error("Failed to parse JSON:", error);
        console.log("Response received:", text);
      }

      showNotification({
        title: "Message Sent",
        message: "We will get back to you as soon as possible.",
        color: theme.colors.green[0],
      });

      // Clear form fields
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const selectStyles = (
    theme: MantineTheme
  ): Partial<Record<SelectStylesNames, CSSProperties>> => ({
    // Correct style properties based on Mantine's documentation
    // Example:
    wrapper: {
      color: theme.colors.tan[0],
      backgroundColor: theme.colors.gray[0],
    },
    section: {
      color: theme.colors.tan[0],
      backgroundColor: theme.colors.gray[0],
    },
    input: {
      color: theme.colors.gray[0],
      backgroundColor: theme.colors.sage[0],
    },
    dropdown: {
      backgroundColor: theme.colors.gray[0],
      borderColor: theme.colors.gray[2],
      color: theme.colors.tan[0],
      border: "1px solid white",
    },
    label: {
      color: theme.colors.tan[0],
    },
  });

  return (
    <div
      id="contact"
      style={{
        paddingTop: "15rem",
        paddingBottom: "15rem",
        height: "100vh",
        backgroundColor: theme.colors.gray[0],
      }}
    >
      <Container size="md" style={{ fontFamily: theme.headings.fontFamily }}>
        <Title order={2} style={{ color: theme.colors.tan[0] }}>
          Contact Us
        </Title>
        <Box component="form" onSubmit={handleSubmit}>
          <TextInput
            required
            label="Name"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => {
              const { value } = e.target;
              setFormData((prevFormData) => ({ ...prevFormData, name: value }));
            }}
            styles={selectStyles(theme)}
          />

          <TextInput
            required
            label="Email"
            placeholder="Your email"
            value={formData.email}
            styles={selectStyles(theme)}
            error={emailError}
            onChange={(e) => {
              const { value } = e.target;
              setFormData((prevFormData) => ({
                ...prevFormData,
                email: value,
              }));
            }}
          />

          <Select
            label="Subject"
            placeholder="Select inquiry type"
            value={formData.subject}
            data={[
              { value: "Product Inquiry", label: "Product/Print Inquiry" },
              { value: "Custom Order", label: "Custom Order" },
              { value: "Licensing", label: "Licensing & Commercial Use" },
              { value: "General", label: "General Question" },
            ]}
            styles={selectStyles(theme)}
            onChange={(value) => {
              setFormData((prevFormData) => ({
                ...prevFormData,
                subject: value || "",
              }));
            }}
          />

          <Textarea
            required
            label="Message"
            placeholder="Your message"
            autosize
            minRows={3}
            value={formData.message}
            styles={selectStyles(theme)}
            onChange={(e) => {
              const { value } = e.target;
              setFormData((prevFormData) => ({
                ...prevFormData,
                message: value,
              }));
            }}
          />

          <Button type="submit">Send Request</Button>
        </Box>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Image
            src={logo}
            alt="logo"
            style={{
              height: "100px",
              width: "100px",
            }}
          />
        </div>
      </Container>
    </div>
  );
};

export default Contact;
