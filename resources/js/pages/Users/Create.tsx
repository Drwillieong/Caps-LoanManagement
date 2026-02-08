import { Head } from '@inertiajs/react'

import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Members',
        href: '/users',
    },
    {
        title: 'Create Member',
        href: '/users/create',
    },
]

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Members" />

           
        </AppLayout>
    )
}
