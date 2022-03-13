import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.config'
import { toast } from 'react-toastify'

function Contact() {
  const [message, setMessage] = useState('')
  const [seller, setSeller] = useState(null)
  // eslint-disable-next-line
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useParams()

  useEffect(() => {
    const getSeller = async () => {
      const docRef = doc(db, 'users', params.sellerId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setSeller(docSnap.data())
      } else {
        toast.error('Could not get seller data')
      }
    }

    getSeller()
  }, [params.sellerId])

  const onChange = (e) => setMessage(e.target.value)

  return (
    <div className='pageContainer'>
      <header>
        <p className='pageHeader'>Contact Seller</p>
      </header>

      {seller !== null && (
        <main>
          <div className='contactSeller'>
            <p className='sellerName'>Contact {seller?.name}</p>
          </div>

          <form className='messageForm'>
            <div className='messageDiv'>
              <label htmlFor='message' className='messageLabel'>
                Message
              </label>
              <textarea
                name='message'
                id='message'
                className='messageTextarea'
                value={message}
                onChange={onChange}
              ></textarea>
            </div>

            <a
              href={`mailto:${seller.email}?Subject=${searchParams.get(
                'listingName'
              )}&body=${message}`}
            >
              <button type='button' className='primaryButton'>
                Send Message
              </button>
            </a>
          </form>
        </main>
      )}
    </div>
  )
}

export default Contact