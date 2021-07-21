<script>
    import Navigation from '../components/Navigation.svelte';
</script>

<div>
    <Navigation />
    <slot>
    </slot>
</div>

<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>