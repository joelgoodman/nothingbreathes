import { DateTime } from "luxon";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import blogTools from "eleventy-plugin-blog-tools";
import htmlmin from "html-minifier";
import CleanCSS from "clean-css";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it"; // Add this import

const TIME_ZONE = "America/Los_Angeles";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(blogTools);
  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addWatchTarget("./src/assets/css/nb.css");

  	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed.xml",
		collection: {
			name: "posts", // iterate over `collections.posts`
			limit: 0, // 0 means no limit
		},
		metadata: {
			language: "en",
			title: "nothing breathes / joel goodman",
			subtitle: "A personal blog by Joel Goodman. Rewinding it to '06 or so.",
			base: "https://nothingbreathes.online/",
			author: {
				name: "Joel Goodman",
				email: "hello@joelgoodman.co",
			},
		},
	});

  eleventyConfig.addDateParsing(function (dateValue) {
		let localDate;
		if (dateValue instanceof Date) {
			// and YAML
			localDate = DateTime.fromJSDate(dateValue, { zone: "utc" }).setZone(
				TIME_ZONE,
				{ keepLocalTime: true }
			);
		} else if (typeof dateValue === "string") {
			localDate = DateTime.fromISO(dateValue, { zone: TIME_ZONE });
		}
		if (localDate?.isValid === false) {
			throw new Error(
				`Invalid \`date\` value (${dateValue}) is invalid for ${this.page.inputPath}: ${localDate.invalidReason}`
			);
		}
		return localDate;
  });

  /* Date filters */
  // Human readable
  eleventyConfig.addFilter("readableDate", dateValue => {
    return DateTime.fromJSDate(dateValue, {zone: TIME_ZONE}).toFormat("dd LLL yyyy");
  });

  eleventyConfig.addFilter("yearDate", dateValue => {
    return DateTime.fromJSDate(dateValue, {zone: TIME_ZONE}).toFormat("yyyy");
  });

  // Machine Readable https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateValue) => {
    return DateTime.fromJSDate(dateValue, {zone: TIME_ZONE}).toFormat('yyyy-LL-dd');
  });

  /* Minification filters */
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });


  eleventyConfig.addTransform("htmlmin", function(content) {
    if( this.outputPath.endsWith(".html") ) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    }

    return content;
  });

 function getPosts(collectionApi) {
		return collectionApi
			.getFilteredByGlob("./src/posts/**/*.md")
			.reverse()
			.filter(function (item) {
				return !!item.data.permalink;
			});
 }

 eleventyConfig.addCollection("posts", function (collection) {
		return getPosts(collection);
 });

  /* Passthrough for assets */
  eleventyConfig.addPassthroughCopy({ "src/assets/fonts": "assets/fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets/img/favicon.svg": "assets/img/favicon.svg" });

  // Markdown configuration
  let options = {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  };
  let opts = {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#"
  };

  const markdownLib = markdownIt(options).use(markdownItAnchor, opts); // Use imported markdownItAnchor
  eleventyConfig.setLibrary("md", markdownLib);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
}
