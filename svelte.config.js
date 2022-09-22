import sveltePreprocess from "svelte-preprocess";
import nesting from "postcss-nesting";

export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    postcss: {
      plugins: [nesting()],
    },
  }),
};
