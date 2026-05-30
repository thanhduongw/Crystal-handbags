package iuh.fit.se.backend.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange}")
    private String mainExchangeName;

    @Value("${app.rabbitmq.queue.order-created}")
    private String orderCreatedQueueName;

    @Value("${app.rabbitmq.queue.order-cancelled}")
    private String orderCancelledQueueName;

    @Value("${app.rabbitmq.queue.payment-succeeded}")
    private String paymentSucceededQueueName;

    @Value("${app.rabbitmq.queue.payment-failed}")
    private String paymentFailedQueueName;

    @Value("${app.rabbitmq.routing-key.order-created}")
    private String orderCreatedRoutingKey;

    @Value("${app.rabbitmq.routing-key.order-cancelled}")
    private String orderCancelledRoutingKey;

    @Value("${app.rabbitmq.routing-key.payment-succeeded}")
    private String paymentSucceededRoutingKey;

    @Value("${app.rabbitmq.routing-key.payment-failed}")
    private String paymentFailedRoutingKey;

    @Bean
    public TopicExchange mainExchange() {
        return new TopicExchange(mainExchangeName, true, false);
    }

    @Bean
    public Queue orderCreatedQueue() {
        return QueueBuilder.durable(orderCreatedQueueName).build();
    }

    @Bean
    public Queue orderCancelledQueue() {
        return QueueBuilder.durable(orderCancelledQueueName).build();
    }

    @Bean
    public Queue paymentSucceededQueue() {
        return QueueBuilder.durable(paymentSucceededQueueName).build();
    }

    @Bean
    public Queue paymentFailedQueue() {
        return QueueBuilder.durable(paymentFailedQueueName).build();
    }

    @Bean
    public Binding orderCreatedBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(orderCreatedQueue()).to(mainExchange).with(orderCreatedRoutingKey);
    }

    @Bean
    public Binding orderCancelledBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(orderCancelledQueue()).to(mainExchange).with(orderCancelledRoutingKey);
    }

    @Bean
    public Binding paymentSucceededBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(paymentSucceededQueue()).to(mainExchange).with(paymentSucceededRoutingKey);
    }

    @Bean
    public Binding paymentFailedBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(paymentFailedQueue()).to(mainExchange).with(paymentFailedRoutingKey);
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
