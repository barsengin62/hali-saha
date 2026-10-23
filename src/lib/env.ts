/** .env değerlerine tek bir yerden, tipli erişim. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
}
