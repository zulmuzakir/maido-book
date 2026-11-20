<script lang="ts">
	import { firstName } from '#lib/format.ts';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import PreferenceItems from './preference-items.svelte';

	let { user }: { user: { name: string; email: string } } = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		aria-label={m.user_menu_label({ name: user.name })}
		class="flex w-full items-center justify-center gap-2.5 rounded-lg p-0 text-left transition-colors outline-none hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring xl:justify-start xl:px-1.5 xl:py-2.5"
	>
		<InitialsAvatar
			name={user.name}
			size={30}
			class="bg-sidebar-primary font-bold text-sidebar-primary-foreground xl:!size-7"
		/>
		<span
			class="min-w-0 flex-1 truncate text-ui font-semibold text-sidebar-foreground max-xl:hidden"
			>{firstName(user.name)}</span
		>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content side="right" align="end" class="w-56 rounded-xl">
		<DropdownMenu.Label>
			<div class="font-medium">{user.name}</div>
			<div class="text-xs font-normal text-muted-foreground">{user.email}</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<PreferenceItems />
		<DropdownMenu.Separator />
		<form method="post" action="/logout">
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<button type="submit" {...props} class="{props.class as string} w-full">
						{m.sign_out()}
					</button>
				{/snippet}
			</DropdownMenu.Item>
		</form>
	</DropdownMenu.Content>
</DropdownMenu.Root>
