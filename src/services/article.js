import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const articleApi = createApi({
    reducerPath: 'articleApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    endpoints: (builder) => ({
      getSummary: builder.query({
        query: (params) => `analyze?repo=${encodeURIComponent(params.repoUrl)}`,
      }),
    }),
  })
  
  export const { useLazyGetSummaryQuery } = articleApi