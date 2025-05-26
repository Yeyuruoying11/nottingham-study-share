export const siteConfig = {
  name: "诺丁汉留学圈",
  description: "专为诺丁汉大学留学生打造的社交分享平台",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.newbiemap.com",
  ogImage: "/og-image.jpg",
  links: {
    github: "https://github.com/Yeyuruoying11/nottingham-study-share",
  },
  creator: {
    name: "诺丁汉留学圈团队",
    url: "https://www.newbiemap.com",
  },
};

export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production"; 