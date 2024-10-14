import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
  Link,
  Button,
} from '@react-email/components';



export default function ForgetPassword({ username, otp }) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Forget Password Link</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Here&apos;s your Password change link : {`https://youtube-clone-iota-ecru-26.vercel.app/forgetpassword?token=${otp}`}</Preview>
      <Section>
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        <Row>
          <Text>
            Thank you for registering. Please use the following verification
            code to complete your registration:
          </Text>
        </Row>
        <Row>
          <Text>
            Here&apos;s your Password change link:
            <Link
              href={`https://youtube-clone-iota-ecru-26.vercel.app/forgetpassword?token=${otp}`}
              style={{ color: 'blue', textDecoration: 'underline', marginLeft: '5px' }}
            >
              Click here
            </Link>
          </Text>
        </Row>
        <Row>
          <Text>
            If you did not request this code, please ignore this email.
          </Text>
        </Row>
        {/* <Row>
            <Button
              href={`http://localhost:3000/verify/${username}`}
              style={{ color: '#61dafb' }}
            >
              Verify here
            </Button>
          </Row> */}
      </Section>
    </Html>
  );
}
