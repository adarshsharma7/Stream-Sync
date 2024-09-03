import React, { useState } from 'react'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { chatMessageSchema } from "@/Schemas/sendChatmessagesSchema"
import { Button } from './ui/button'
import { Input } from './ui/input'

function ChatOpen({ avatar, username, chatId }) {
    const [message, setMessage] = useState("")

    const form = useForm({
        resolver: zodResolver(chatMessageSchema),
        defaultValues: {
            chatMessage: ""
        }
    })
    return (
        <div className='flex flex-col border-2 border-red-600 h-full w-full' >
            <div className='h-[83%] border-2 border-green-500'>
                <h1>All Chats</h1>
            </div>
            <div className='h-[17%] w-full'>
                <div className='w-full'>
                    <Form {...form}>

                        <div className="flex">
                            <FormField
                                control={form.control}
                                name="chatMessage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type='text'
                                                    placeholder='Add your message...'
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500"
                                                    {...field}
                                                    value={message}
                                                    onChange={(e) => {
                                                        setMessage(e.target.value)

                                                    }}
                                                />

                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className='ml-2'>
                                  <Button
                                type="submit"
                                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
                            >
                                Send
                            </Button>
                            </div>
                          
                        </div>





                    </Form>
                </div>
            </div>

        </div >
    )
}

export default ChatOpen
