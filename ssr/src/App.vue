<template>
  <section class="demo-class">SSR=><input v-model="fooRef"/></section>
</template>

<script lang="ts" setup>

import { ref, watchEffect } from 'vue';

const props = defineProps({ foo: {} });

const fooRef = ref(props.foo);

watchEffect(() => console.log(fooRef));
</script>
