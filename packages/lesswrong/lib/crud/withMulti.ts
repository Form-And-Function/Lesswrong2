/*

### withMulti

Paginated items container

Options:

  - collection: the collection to fetch the documents from
  - fragment: the fragment that defines which properties to fetch
  - fragmentName: the name of the fragment, passed to getFragment
  - limit: the number of documents to show initially
  - pollInterval: how often the data should be updated, in ms (set to 0 to disable polling)
  - terms: an object that defines which documents to fetch

Props Received:

  - terms: an object that defines which documents to fetch

Terms object can have the following properties:

  - view: String
  - userId: String
  - cat: String
  - date: String
  - after: String
  - before: String
  - enableTotal: Boolean
  - enableCache: Boolean
  - listId: String
  - query: String # search query
  - postId: String
  - limit: String

*/

import { WatchQueryFetchPolicy, ApolloError } from 'apollo-client';
import gql from 'graphql-tag';
import qs from 'qs';
import { useContext, useState } from 'react';
import { graphql, useQuery } from 'react-apollo';
import compose from 'recompose/compose';
import withState from 'recompose/withState';
import * as _ from 'underscore';
import { LocationContext, NavigationContext } from '../vulcan-core/appContext';
import { extractCollectionInfo, extractFragmentInfo, multiClientTemplate, Utils } from '../vulcan-lib';

function getGraphQLQueryFromOptions({
  collectionName, collection, fragmentName, fragment, extraQueries, extraVariables,
}) {
  const typeName = collection.options.typeName;
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  let extraVariablesString = ''
  if (extraVariables) {
    extraVariablesString = Object.keys(extraVariables).map(k => `$${k}: ${extraVariables[k]}`).join(', ')
  }
  
  // build graphql query from options
  return gql`
    ${multiClientTemplate({ typeName, fragmentName, extraQueries, extraVariablesString })}
    ${fragment}
  `;
}

export function withMulti({
  limit = 10, // Only used as a fallback if terms.limit is not specified
  pollInterval = 0, //LESSWRONG: Polling is disabled, and by now it would probably horribly break if turned on
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  enableCache = false,
  extraQueries,
  ssr = false, //LESSWRONG: SSR defaults false
  extraVariables,
  fetchPolicy,
  notifyOnNetworkStatusChange,
  propertyName = "results",
  collectionName, collection,
  fragmentName, fragment,
  terms: queryTerms,
}: {
  limit?: number,
  pollInterval?: number,
  enableTotal?: boolean,
  enableCache?: boolean,
  extraQueries?: any,
  ssr?: boolean,
  extraVariables?: any,
  fetchPolicy?: WatchQueryFetchPolicy,
  notifyOnNetworkStatusChange?: boolean,
  propertyName?: string,
  collectionName?: CollectionNameString,
  collection?: any,
  fragmentName?: string,
  fragment?: any,
  terms?: any,
}) {
  // if this is the SSR process, set pollInterval to null
  // see https://github.com/apollographql/apollo-client/issues/1704#issuecomment-322995855
  //pollInterval = typeof window === 'undefined' ? null : pollInterval;

  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));

  const typeName = collection.options.typeName;
  const resolverName = collection.options.multiResolverName;
  
  const query = getGraphQLQueryFromOptions({ collectionName, collection, fragmentName, fragment, extraQueries, extraVariables });

  return compose(
    // wrap component with HoC that manages the terms object via its state
    withState('paginationTerms', 'setPaginationTerms', (props: any) => {
      // get initial limit from props, or else options
      const paginationLimit = (props.terms && props.terms.limit) || limit;
      const paginationTerms = {
        limit: paginationLimit,
        itemsPerPage: paginationLimit,
      };

      return paginationTerms;
    }),

    // wrap component with graphql HoC
    graphql(
      query,

      {
        alias: `with${Utils.pluralize(typeName)}`,

        // graphql query options
        options(props: any) {
          const { terms, paginationTerms, ...rest } = props;
          // get terms from options, then props, then pagination
          const mergedTerms = { ...queryTerms, ...terms, ...paginationTerms };
          const graphQLOptions: any = {
            variables: {
              input: {
                terms: mergedTerms,
                enableCache,
                enableTotal,
              },
              ...(_.pick(rest, Object.keys(extraVariables || {})))
            },
            // note: pollInterval can be set to 0 to disable polling (20s by default)
            pollInterval,
            ssr,
          };

          if (fetchPolicy) {
            graphQLOptions.fetchPolicy = fetchPolicy;
          }

          // set to true if running into https://github.com/apollographql/apollo-client/issues/1186
          if (notifyOnNetworkStatusChange) {
            graphQLOptions.notifyOnNetworkStatusChange = notifyOnNetworkStatusChange;
          }

          return graphQLOptions;
        },

        // define props returned by graphql HoC
        props(props: any) {
          // see https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/src/core/networkStatus.ts
          if (!(props?.data)) throw new Error("Missing props.data");
          const refetch = props.data.refetch,
            // results = Utils.convertDates(collection, props.data[listResolverName]),
            results = props.data[resolverName] && props.data[resolverName].results,
            totalCount = props.data[resolverName] && props.data[resolverName].totalCount,
            networkStatus = props.data.networkStatus,
            loadingInitial = props.data.networkStatus === 1,
            loading = props.data.networkStatus === 1,
            loadingMore = props.data.networkStatus === 2,
            error = props.data.error;

          if (error) {
            // eslint-disable-next-line no-console
            console.log(error);
          }

          return {
            // see https://github.com/apollostack/apollo-client/blob/master/src/queries/store.ts#L28-L36
            // note: loading will propably change soon https://github.com/apollostack/apollo-client/issues/831
            loading,
            loadingInitial,
            loadingMore,
            [propertyName]: results,
            totalCount,
            refetch,
            networkStatus,
            error,
            count: results && results.length,

            // regular load more (reload everything)
            loadMore(providedTerms) {
              // if new terms are provided by presentational component use them, else default to incrementing current limit once
              const newTerms =
                typeof providedTerms === 'undefined'
                  ? {
                      /*...props.ownProps.terms,*/ ...props.ownProps.paginationTerms,
                      limit: results.length + props.ownProps.paginationTerms.itemsPerPage,
                    }
                  : providedTerms;

              props.ownProps.setPaginationTerms(newTerms);
            },

            fragmentName,
            fragment,
            ...props.ownProps, // pass on the props down to the wrapped component
            data: props.data,
          };
        },
      }
    )
  );
}

export function useMulti<FragmentTypeName extends keyof FragmentTypes>({
  terms,
  extraVariablesValues,
  pollInterval = 0, //LESSWRONG: Polling defaults disabled
  enableTotal = false, //LESSWRONG: enableTotal defaults false
  enableCache = false,
  extraQueries,
  ssr = false, //LESSWRONG: SSR defaults false
  extraVariables,
  fetchPolicy,
  collectionName, collection,
  fragmentName, fragment,
  limit:initialLimit = 10, // Only used as a fallback if terms.limit is not specified
  itemsPerPage = 10,
  skip = false,
  queryLimitName,
}: {
  terms: any,
  extraVariablesValues?: any,
  pollInterval?: number,
  enableTotal?: boolean,
  enableCache?: boolean,
  extraQueries?: any,
  ssr?: boolean,
  extraVariables?: any,
  fetchPolicy?: WatchQueryFetchPolicy,
  collectionName?: CollectionNameString,
  collection?: any,
  fragmentName?: FragmentTypeName,
  fragment?: any,
  limit?: number,
  itemsPerPage?: number,
  skip?: boolean,
  queryLimitName?: string,
}): {
  loading: boolean,
  loadingInitial: boolean,
  loadingMore: boolean,
  results: Array<FragmentTypes[FragmentTypeName]>,
  totalCount?: number,
  refetch: any,
  error: ApolloError|undefined,
  count?: number,
  showLoadMore: boolean,
  loadMoreProps: any,
  loadMore: any,
  limit: number,
} {
  // Since we don't have access to useLocation and useNavigation we have to manually reference context here
  const { query: locationQuery, location } = useContext(LocationContext);
  const { history } = useContext(NavigationContext)

  const defaultLimit = ((locationQuery && queryLimitName && parseInt(locationQuery[queryLimitName])) || (terms && terms.limit) || initialLimit)
  const [ limit, setLimit ] = useState(defaultLimit);
  const [ hasRequestedMore, setHasRequestedMore ] = useState(false);
  
  ({ collectionName, collection } = extractCollectionInfo({ collectionName, collection }));
  ({ fragmentName, fragment } = extractFragmentInfo({ fragmentName, fragment }, collectionName));
  
  const query = getGraphQLQueryFromOptions({ collectionName, collection, fragmentName, fragment, extraQueries, extraVariables });
  const resolverName = collection.options.multiResolverName;
  
  const {data, error, loading, refetch} = useQuery(query, {
    variables: {
      input: {
        terms: { ...terms, limit: limit },
        enableCache, enableTotal,
      },
      ...(_.pick(extraVariablesValues, Object.keys(extraVariables || {})))
    },
    pollInterval,
    fetchPolicy,
    ssr,
    skip,
  });
  
  const count = (data && data[resolverName] && data[resolverName].results && data[resolverName].results.length) || 0;
  const totalCount = data && data[resolverName] && data[resolverName].totalCount;
  
  // If we did a query to count the total number of results (enableTotal),
  // show a Load More if we have fewer than that many results. If we didn't do
  // that, show a Load More if we got at least as many results as requested.
  // This means that if the total number of results exactly matches the limit,
  // the last click of Load More won't get any more documents.
  //
  // The caller of this function is responsible for showing a Load More button
  // if showLoadMore returned true.
  const showLoadMore = enableTotal ? (count < totalCount) : (count >= limit);
  
  const loadMore = (limitOverride: number) => {
    setHasRequestedMore(true);
    const newLimit = limitOverride || (limit+itemsPerPage)
    setLimit(newLimit);
    if (queryLimitName) {
      const newQuery = {...locationQuery, [queryLimitName]: newLimit}
      history.push({...location, search: `?${qs.stringify(newQuery)}`})
    }
  };
  
  // A bundle of props that you can pass to Components.LoadMore, to make
  // everything just work.
  const loadMoreProps = {
    loadMore, count, totalCount,
    hidden: !showLoadMore,
  };
  
  return {
    loading,
    loadingInitial: loading && !hasRequestedMore,
    loadingMore: loading && hasRequestedMore,
    results: data && data[resolverName] && data[resolverName].results,
    totalCount: totalCount,
    refetch,
    error,
    count,
    showLoadMore,
    loadMoreProps,
    loadMore,
    limit,
  };
}

export default withMulti;
