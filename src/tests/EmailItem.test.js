import { render, screen } from '@testing-library/vue';
import EmailItem from '../components/EmailItem.vue';

test('renders email item with correct content', async () => {
  const email = {
    id: 1,
    subject: 'Hello',
    sender: 'example@example.com',
    date: '2022-01-01',
  };

  render(EmailItem, {
    props: {
      email,
    },
  });

  const subjectElement = await screen.findByText(/Hello/i);
  const senderElement = await screen.findByText(/example@example.com/i);
  const dateElement = await screen.findByText(/2022-01-01/i);

  expect(subjectElement).toBeInTheDocument();
  expect(senderElement).toBeInTheDocument();
  expect(dateElement).toBeInTheDocument();
});

test('renders email item with unread style', async () => {
  const email = {
    id: 1,
    subject: 'Hello',
    sender: 'example@example.com',
    date: '2022-01-01',
    unread: true,
  };

  render(EmailItem, {
    props: {
      email,
    },
  });

  const emailItemElement = await screen.findByTestId('email-item');
  expect(emailItemElement).toHaveClass('unread');
});

test('renders email item without unread style', async () => {
  const email = {
    id: 1,
    subject: 'Hello',
    sender: 'example@example.com',
    date: '2022-01-01',
    unread: false,
  };

  render(EmailItem, {
    props: {
      email,
    },
  });

  const emailItemElement = await screen.findByTestId('email-item');
  expect(emailItemElement).not.toHaveClass('unread');
});
