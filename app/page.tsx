'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to bookmarks if already authenticated
    if (!loading && user) {
      router.push('/bookmarks')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Bookmark className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Smart Bookmarks</CardTitle>
          <CardDescription>
            Save, organize, and access your bookmarks from anywhere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time sync across all your devices</li>
              <li>• Secure Google authentication</li>
              <li>• Fast and intuitive interface</li>
              <li>• Private bookmarks only you can see</li>
            </ul>
          </div>
          <Button onClick={signInWithGoogle} className="w-full" size="lg">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
