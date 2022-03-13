import { Link } from 'react-router-dom'
import Slider from '../components/Slider'
import newCategoryImage from '../assets/jpg/newCategoryImage.jpg'
import usedCategoryImage from '../assets/jpg/usedCategoryImage.jpg'

function Explore() {
  return (
    <div className='explore'>
      <header>
        <p className='pageHeader'>Explore</p>
      </header>

      <main>
        <Slider />

        <p className='exploreCategoryHeading'>Categories</p>
        <div className='exploreCategories'>
          <Link to='/category/new'>
            <img
              src={newCategoryImage}
              alt='new'
              className='exploreCategoryImg'
            />
            <p className='exploreCategoryName'>New Cars</p>
          </Link>
          <Link to='/category/used'>
            <img
              src={usedCategoryImage}
              alt='used'
              className='exploreCategoryImg'
            />
            <p className='exploreCategoryName'>Used Cars</p>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Explore