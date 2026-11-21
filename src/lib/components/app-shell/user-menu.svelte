<script lang="ts">
	import { resolve } from '$app/paths';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { firstName } from '#lib/format.ts';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import PreferenceItems from './preference-items.svelte';

	let { user }: { user: { name: string; email: string } } = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		aria-label={m.user_menu_label({ name: user.name })}
		class="flex items-center gap-2.5 rounded-full text-left outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring xl:h-12 xl:w-full xl:rounded-lg xl:px-1.5 xl:transition-colors xl:duration-(--motion-fast) xl:ease-motion xl:hover:bg-sidebar-accent/60"
	>
		<InitialsAvatar
			name={user.name}
			class="size-[34px] bg-sidebar-accent text-sm font-bold text-primary-text xl:size-[30px] xl:text-[13px]"
		/>
		<span class="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground max-xl:hidden"
			>{firstName(user.name)}</span
		>
		<Ellipsis class="size-4 shrink-0 text-sidebar-muted/60 max-xl:hidden" aria-hidden="true" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content side="right" align="end" class="w-56 rounded-xl">
		<DropdownMenu.Label>
			<div class="font-medium">{user.name}</div>
			<div class="text-xs font-normal text-muted-foreground">{user.email}</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<PreferenceItems />
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<form method="post" action={resolve('/logout')}>
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<button type="submit" {...props} class={cn(props.class as string, 'w-full')}>
							{m.sign_out()}
						</button>
					{/snippet}
				</DropdownMenu.Item>
			</form>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
