import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

export const ExternalWrapper = styled(Box)(
  (props) => `
  p {
    line-height: ${props.theme.paragraph.medium.height};
  }
  p + p,
   p + ul {
    margin-top: 0;
  }
  a {
    text-decoration: none;
    color: ${normalizeColor(props.theme.anchor.color, props.theme)};
    font-weight: ${props.theme.anchor.fontWeight};
    word-wrap: break-word;
    :hover {
      text-decoration: underline;
      color: ${normalizeColor(props.theme.anchor.color, props.theme)};
      font-weight: ${props.theme.anchor.hover.fontWeight};
    }
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: ${props.theme.heading.font.family};
    font-weight: normal;
    :not(class^="sbdocs") {
      color: ${normalizeColor(props.theme.global.colors.text, props.theme)};
      letter-spacing: 0.5px;
    }
  }
  h3:first-of-type {
    margin-top: 20px;
  }
`
);
