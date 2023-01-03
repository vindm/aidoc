import Head from "next/head";
import useSWR from 'swr';
import {useEffect, useState, lazy, Suspense, useMemo, useCallback} from 'react';
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import {
  Image,
  Page,
  PageContent,
  Main,
  Button,
  Box,
  Stack,
  RangeSelector,
  Text,
  Heading,
  Header,
  Spinner,
  Tabs, Tab,
  Tip
} from 'grommet';
import {ExternalWrapper} from '../components/ExternalWrapper';

const GITLAB_API_BASE_URL = 'https://gitlab.com/api/v4';

export const config = {
  runtime: 'nodejs',
}

export async function getServerSideProps() {
  // Fetch data from external API
  const response = await fetch(`${GITLAB_API_BASE_URL}/projects/37816989/releases`,{
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_TOKEN
    }
  });
  const releases = await response.json();
  // Fetch data from external API
  const tagsresponse = await fetch(`${GITLAB_API_BASE_URL}/projects/37816989/repository/tags?search=.0$`,{
    headers: {
      'PRIVATE-TOKEN': process.env.GITLAB_TOKEN
    }
  });
  const tags = await tagsresponse.json();

  return {
    props: {
      releases: releases
        .filter(release => !release.name.includes('-beta-'))
        .map(({ name, description }) => ({ name, description })),
      tags: tags.map(tag => tag.name)
    }
  }
}

// Fetcher implementation.
// The extra argument will be passed via the `arg` property of the 2nd parameter.
// In the example below, `arg` will be `'my_token'`
async function fetchOverview(url, { arg }) {
  await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ changelog: arg }),
  })
}

export default function Home(props) {
  const { releases, tags } = props;
  const [versions, setVersions] = useState([ 0, 0 ]);

  const prepare = releases
      .reduce((acc, release) => {
        const [ major, minor, patch ] = release.name.replace('v', '').split('.');

        acc[major] || (acc[major] = {
          minors: {}
        });
        acc[major].minors[minor] || (acc[major].minors[minor] = {
          patches: {}
        });
        acc[major].minors[minor].patches[patch] || (acc[major].minors[minor].patches[patch] = release);

        return acc;
      }, {})

  const data = Object.entries(prepare).reduce((acc, [ major, { minors } ]) => {
    const minorsDescriptions = Object.entries(minors).reduce((acc, [ minor, { patches } ]) => {
      const patchesDescriptions = Object.entries(patches).reduce((acc, [ patch, release ]) => {
        return [ release.description, ...acc ];
      }, [])

      return [ {
        name: [major, minor].join('.'),
        description: patchesDescriptions.join('\n')
      }, ...acc ];
    }, [])

    return [ ...minorsDescriptions,  ...acc ];
  }, []);

  const [editorHtmlValue, setEditorHtmlValue] = useState<string>("");
  const [editorMarkdownValue, setEditorMarkdownValue] = useState<string>("");

  const selectedReleases = useMemo(() => data.slice(versions[0], versions[1] + 1), [data, versions]);
  const changelog = useMemo(() => selectedReleases.reduce((acc, release) => acc + ' ' + release.description, ''), [
    selectedReleases
  ]);

  const fetchOverview = useCallback(async ([url, ...versions]) => {
    const selectedReleases = data.slice(versions[0], versions[1] + 1);
    const changelog = selectedReleases.reduce((acc, release) => acc + '\n' + release.description, '');

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ changelog }),
    });

    const res = await result.json();

    if (res.error) {
      throw res.error;
    }

    return res;
  }, [ releases ]);

  const {
    data: overview,
    error,
    isLoading
  } = useSWR([ '/api/generate', ...versions ], fetchOverview, {
    revalidateOnMount: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
    errorRetryCount: 0
  });

  const onEditorContentChanged = (content) => {
    setEditorHtmlValue(content.html);
    setEditorMarkdownValue(content.markdown);
  };

  console.log(data, error);

  return (
    <Page gap={'large'}  flex height={'100vh'}>
      <Head>
        <title>Announcement from changelog</title>
        <link rel="icon" href="/announce.png" />
      </Head>

      <Header justify={'center'}>
        <Image src="/announce.png" width={'150px'} />
      </Header>

      <PageContent flex align={'center'} gap={'large'} width={'large'} pad={{ bottom: 'large' }}>
        <Box gap={'large'} align={'center'}>
          <VersionRangeSelector
              releases={data}
              values={versions}
              onChange={setVersions}
          />
        </Box>

        <Tabs>
          <Tab title="Changelog">
            <Content pad="medium">
              {changelog}
            </Content>
          </Tab>
          <Tab title="Overview">
            <Content pad="medium">
              {isLoading ? <Spinner size={'xlarge'} alignSelf={'center'} /> : error ? error.message : overview ? overview.result : null}
            </Content>
          </Tab>
        </Tabs>

      </PageContent>
    </Page>
  );
}

const Content = props => {
  return (
    <ExternalWrapper background={{ color: 'white', opacity: .1 }} justify={'center'} width={'large'} border='neutral-dark' round={'xsmall'} pad={'medium'}>
      {typeof props.children === 'string' ? <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{props.children}</ReactMarkdown> : props.children}
    </ExternalWrapper>
  )
}

const VersionRangeSelector = props => {
  const { releases, values, onChange } = props;

  return (
      <Stack interactiveChild={1}>
        <Box direction="row" justify="between" align={'center'} width={'large'}>
          {[{ name: '...' }, ...releases].map(rel => rel.name).map(version => (
              <Box border={false} align={'center'} justify={'center'} width={'8px'} height={'32px'}>
                  <Text color={'accent-2'} style={{ fontFamily: 'monospace' }} weight={'bold'} size={'small'}>
                    {version}
                  </Text>
              </Box>
          ))}
        </Box>
        <RangeSelector
            direction="horizontal"
            invert={false}
            min={0}
            max={releases.length - 1}
            size="full"
            round="small"
            values={values}
            onChange={onChange}
        />
      </Stack>
  );
}