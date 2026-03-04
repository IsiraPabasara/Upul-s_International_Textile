'use client'
import React from 'react'
import useUser from '../hooks/useUser'

const page = () => {
    const {user} = useUser();
  return (
    <div>Home Page  {user?.firstname}</div>
  )
}

export default page