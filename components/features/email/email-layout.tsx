import type { PropsWithChildren } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Tailwind,
  Text,
} from "react-email";

import { getServerUrl } from "@/lib/server-url";
import { SITE_CONFIG } from "@/lib/site-config";

export const EmailLayout = (
  props: PropsWithChildren<{ disableTailwind?: boolean }>,
) => {
  let BASE_URL = getServerUrl();

  if (BASE_URL.startsWith("http://localhost"))
    BASE_URL = SITE_CONFIG.SERVER.PROD_URL;

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#ffffff",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        }}
      >
        <Container
          style={{
            margin: "0 auto",
            padding: "1.5rem",
            backgroundSize: "contain",
            backgroundPosition: "bottom",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Tailwind>
            <table cellPadding={0} cellSpacing={0}>
              <tr>
                <td className="pr-2">
                  <Img
                    width={32}
                    height={32}
                    className="inline"
                    alt={`${SITE_CONFIG.TITLE}'s logo`}
                    src={`${BASE_URL}${SITE_CONFIG.LOGO}`}
                  />
                </td>
                <td>
                  <Text className="text-xl font-bold">{SITE_CONFIG.TITLE}</Text>
                </td>
              </tr>
            </table>
            <Hr className="mt-3 mb-6 border-gray-300" />
          </Tailwind>
          {props.disableTailwind ? (
            props.children
          ) : (
            <Tailwind>{props.children}</Tailwind>
          )}
          <Tailwind>
            <Hr className="mt-12 mb-6 border-gray-300" />

            <table cellPadding={0} cellSpacing={0}>
              <tr>
                <td className="pr-2">
                  <Img
                    width={32}
                    height={32}
                    className="inline"
                    alt={`${SITE_CONFIG.TITLE}'s logo`}
                    src={`${BASE_URL}${SITE_CONFIG.LOGO}`}
                  />
                </td>
                <td>
                  <Text className="text-xl">{SITE_CONFIG.TITLE}</Text>
                </td>
              </tr>
            </table>
          </Tailwind>
        </Container>
      </Body>
    </Html>
  );
};
