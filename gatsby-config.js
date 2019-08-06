const NODE_ENV = process.env.NODE_ENV || 'development'

require('dotenv').config({
  path: `.env.${NODE_ENV}`
})

console.log('-- -- -- -- -- -- -- -- --')
console.log('-- -- -- hellow', NODE_ENV)

module.exports = {
  siteMetadata: {
    title: `gatsby-firebase-hosting-starter`,
    description: `Gatsby starter with Firebase hosting configuration`,
    author: `James Wakefield <james.wakefield@debijenkorf.nl>`
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`
      }
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`
      }
    }
    // this (optional) plugin enables Progressive Web App + Offline
    // functionality
    // To learn more, visit: https://gatsby.dev/offline
    // 'gatsby-plugin-offline',
  ]
}
