import { Grommet } from "grommet";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
    @import url("https://fonts.googleapis.com/css?family=Roboto");
    @import url("https://fonts.googleapis.com/css?family=Poppins:400,500,600,700");
    
    html,
    body {
        margin: 0;
        padding: 0;
        max-height: 100vh;
        
        > div > div  {
            height: 100vh;
            overflow-y: scroll;
        }
    }
`;

const theme = {
    global: {
        colors: {
            background: '#0f0228'
        },
        font: {
            family: "'Roboto', sans-serif;",
        },
    },
    heading: {
        font: { family: "'Roboto', sans-serif" }
    }
};

export default function App({ Component, pageProps }) {
    return (
        <>
            <GlobalStyle />
            <Grommet theme={theme}>
                <Component {...pageProps} />
            </Grommet>
        </>
    );
}